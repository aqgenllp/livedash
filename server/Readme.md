ALTER TABLE formationsection_mst
ADD UNIQUE KEY uniq_machine_row (machine_id, formation_id);

ALTER TABLE cosmetic_mst
ADD UNIQUE KEY uniq_machine_row (machine_id, formation_id);

SELECT user, host FROM mysql.user;

CREATE USER 'cdc_user'@'10.10.17.23' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON *.* TO 'cdc_user'@'10.10.17.23';
FLUSH PRIVILEGES;