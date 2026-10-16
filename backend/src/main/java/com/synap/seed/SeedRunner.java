package com.synap.seed;

import com.synap.auth.UserRepository;
import com.synap.config.SeedProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** 앱 시작 시 데모 시드(유저가 없을 때만). 실제 적재는 {@link SeedService}. */
@Component
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final SeedService seedService;
    private final UserRepository users;
    private final SeedProperties seed;

    public SeedRunner(SeedService seedService, UserRepository users, SeedProperties seed) {
        this.seedService = seedService;
        this.users = users;
        this.seed = seed;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seed.enabled()) {
            return;
        }
        if (users.count() > 0) {
            log.info("Seed skipped: users already exist");
            return;
        }
        seedService.seed();
    }
}
