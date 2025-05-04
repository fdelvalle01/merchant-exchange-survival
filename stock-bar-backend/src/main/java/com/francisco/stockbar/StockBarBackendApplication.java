package com.francisco.stockbar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StockBarBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(StockBarBackendApplication.class, args);
		System.out.println("🧪 DB_URL = " + System.getenv("DB_URL"));

	}

}
