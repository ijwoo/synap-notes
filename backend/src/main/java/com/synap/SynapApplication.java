package com.synap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SynapApplication {

    public static void main(String[] args) {
        SpringApplication.run(SynapApplication.class, args);
    }
}
