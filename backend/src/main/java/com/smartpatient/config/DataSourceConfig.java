package com.smartpatient.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.InetSocketAddress;
import java.net.Socket;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:}")
    private String configuredUrl;

    @Value("${spring.datasource.username:root}")
    private String configuredUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Value("${spring.datasource.driver-class-name:}")
    private String configuredDriver;

    @Bean
    @Primary
    public DataSource dataSource() {
        String explicitUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (explicitUrl == null || explicitUrl.trim().isEmpty()) {
            explicitUrl = System.getenv("DATABASE_URL");
        }
        if (explicitUrl == null || explicitUrl.trim().isEmpty()) {
            explicitUrl = System.getenv("DB_URL");
        }

        if (explicitUrl != null && !explicitUrl.trim().isEmpty()) {
            log.info("Using explicitly configured DataSource URL: {}", explicitUrl);
            return createHikariDataSource(explicitUrl, configuredUsername, configuredPassword, configuredDriver);
        }

        // Test if MySQL on port 3306 is actively listening
        boolean mysqlAvailable = isPortAvailable("127.0.0.1", 3306, 600);
        if (mysqlAvailable) {
            log.info("Local MySQL server detected on port 3306. Connecting to MySQL...");
            String mysqlUrl = "jdbc:mysql://localhost:3306/smart_patient_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&autoReconnect=true";
            return createHikariDataSource(mysqlUrl, configuredUsername, configuredPassword, "com.mysql.cj.jdbc.Driver");
        } else {
            log.info("MySQL is offline on port 3306. Seamlessly running with embedded H2 database (MySQL compatibility mode)...");
            String h2Url = "jdbc:h2:mem:smart_patient_db;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
            return createHikariDataSource(h2Url, "sa", "", "");
        }
    }

    private HikariDataSource createHikariDataSource(String url, String username, String password, String driver) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        if (driver != null && !driver.trim().isEmpty()) {
            config.setDriverClassName(driver);
        }
        config.setPoolName("SmartPatientHikariPool");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(15000);
        return new HikariDataSource(config);
    }

    private boolean isPortAvailable(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
