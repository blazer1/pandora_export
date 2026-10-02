# Moving Learning Suite from the NAS to the Pi

You don't move PHP or WordPress itself. Install them fresh on the Pi and move only the two things that are yours:

1. The plugin folder, `learning-suite-api`, which is already on your PC.
2. Your data: the five `wp_ls_…` tables in the database, plus your settings row.

WordPress is only a host for the app. Decks, documents, question banks and results all live in the `ls_` tables, so you don't need the NAS's whole WordPress install. (If you've also written posts or pages in that WordPress, you need a full-site migration instead.)

## Part 1: Export your data from the NAS

### Option A: phpMyAdmin

1. Open the `wordpress` database, then the **Export** tab, then choose **Custom**.
2. Under **Tables**, select only `wp_ls_banks`, `wp_ls_decks`, `wp_ls_documents`, `wp_ls_exam_results` and `wp_ls_groups`.
3. Under **Object creation options**, tick **Add DROP TABLE**. Importing then replaces the empty tables the plugin will create on the Pi.
4. Click **Export** and save the file as `learning-suite.sql`.

### Option B: over SSH on the NAS

```bash
mysqldump -u wpuser -p wordpress wp_ls_decks wp_ls_groups wp_ls_documents wp_ls_banks wp_ls_exam_results > learning-suite.sql
mysqldump -u wpuser -p wordpress wp_options --where="option_name='ls_appearance'" --no-create-info --replace > ls-settings.sql
```

- `mysqldump` writes tables out as a text file of SQL commands that rebuild them.
- `-p` makes it ask for the password.
- `>` sends the output into a file.
- The second command saves just your settings row (theme, reading speed, deck order, exam settings). `--no-create-info` leaves out the table structure, and `--replace` writes it so it overwrites the default row on import.

If the NAS says `mysqldump: not found`, use phpMyAdmin instead. Your settings take a minute to set again by hand.

## Part 2: Set up the Pi (over SSH)

### 1. Update and install the stack

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y apache2 mariadb-server php libapache2-mod-php php-mysql php-xml php-mbstring php-curl php-zip php-gd php-intl
```

`apache2` is the web server, `mariadb-server` the database, and `php` plus `libapache2-mod-php` let Apache run PHP. The `php-…` packages are the extensions WordPress uses.

### 2. Secure MariaDB

```bash
sudo mariadb-secure-installation
```

Answer yes to removing anonymous users, disallowing remote root login, and removing the test database.

One difference from the NAS: on Raspberry Pi OS, MariaDB's root account logs in through your Linux account (`sudo mariadb`) instead of a password. Only users who can use `sudo` can get in, which is safer than a password.

### 3. Create the database and `wpuser`

```bash
sudo mariadb
```

Then, at the `MariaDB>` prompt:

```sql
CREATE DATABASE wordpress CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wpuser'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON wordpress.* TO 'wpuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

This time `wpuser` gets no extra powers: no `WITH GRANT OPTION`, and no wildcard databases.

### 4. Install WordPress

```bash
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
sudo mv wordpress /var/www/html/wordpress
sudo chown -R www-data:www-data /var/www/html/wordpress
```

- `tar -xzf` unpacks the download.
- `chown -R www-data:www-data` hands the files to `www-data`, the account Apache runs as. Without this, WordPress can't write its own files and you'd get the "FTP credentials" prompt again.

### 5. Run the WordPress setup

Open `http://<pi-hostname>/wordpress` (or the Pi's IP) in your browser and fill in the same five fields as on the NAS: `wordpress`, `wpuser`, your password, `localhost`, `wp_`. Then create your admin account.

## Part 3: Bring the app and data across

### 6. Copy the plugin

FileZilla (SFTP, your Pi username) logs in as your user, which can't write into a folder owned by `www-data`. So drag `learning-suite-api` into your home folder first, then move it in over SSH:

```bash
sudo mv ~/learning-suite-api /var/www/html/wordpress/wp-content/plugins/
sudo chown -R www-data:www-data /var/www/html/wordpress/wp-content/plugins/learning-suite-api
```

### 7. Activate it

In WordPress admin under **Plugins**. That creates the five tables, still empty.

### 8. Import your data

Copy `learning-suite.sql` (and `ls-settings.sql` if you made it) to the Pi's home folder, then:

```bash
mariadb -u wpuser -p wordpress < learning-suite.sql
mariadb -u wpuser -p wordpress < ls-settings.sql
```

`<` feeds the file into the `mariadb` command, which runs every SQL statement in it.

If the import complains about an unknown collation (`utf8mb4_uca1400_ai_ci` or similar), the NAS's MariaDB is newer than the Pi's. Run this once on the file, then import again:

```bash
sed -i 's/utf8mb4_uca1400_ai_ci/utf8mb4_unicode_ci/g' learning-suite.sql
```

### 9. Check it

Open:

```
http://<pi-hostname>/wordpress/wp-content/plugins/learning-suite-api/app/index.html
```

Your decks, groups, reader documents, question banks and exam history should all be there. Bookmark it.

## Afterwards

- Keep the NAS version running until you've confirmed everything on the Pi. Nothing in this process changes the NAS, so it's your fallback.
- Once you're happy, turn off the WordPress app in the My Cloud dashboard to free up its memory.
- The Pi doesn't need "pretty permalinks" or any `.htaccess` setup, because the app talks to WordPress through `?rest_route=`.
