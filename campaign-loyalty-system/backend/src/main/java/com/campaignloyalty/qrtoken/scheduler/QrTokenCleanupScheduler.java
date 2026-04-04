package com.campaignloyalty.qrtoken.scheduler;

import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@AllArgsConstructor
public class QrTokenCleanupScheduler {

    private final QrTokenRepository qrTokenRepository;

    @Scheduled(fixedRate = 60000) // every minute
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        List<QrToken> expired = qrTokenRepository.findByExpiresAtBefore(now);
        qrTokenRepository.deleteAll(expired);
    }
}
