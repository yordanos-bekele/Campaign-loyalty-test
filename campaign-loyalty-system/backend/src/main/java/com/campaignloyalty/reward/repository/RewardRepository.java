package com.campaignloyalty.reward.repository;

import com.campaignloyalty.dashboard.dto.CustomerMetricCountDto;
import com.campaignloyalty.reward.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Integer> {

    @Query("""
            select count(r.id)
            from Reward r
            where r.hotelId = :hotelId
              and r.confirmedAt is not null
              and r.earnedAt between :start and :end
            """)
    long countConfirmedByHotelIdAndEarnedAtBetween(Integer hotelId, LocalDateTime start, LocalDateTime end);

    @Query("""
            select count(r.id)
            from Reward r
            where r.confirmedAt is not null
              and r.earnedAt between :start and :end
            """)
    long countConfirmedByEarnedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
            select new com.campaignloyalty.dashboard.dto.CustomerMetricCountDto(
                r.customerId,
                count(r.id)
            )
            from Reward r
            where r.customerId in :customerIds
              and r.confirmedAt is not null
            group by r.customerId
            """)
    List<CustomerMetricCountDto> countRewardsByCustomerIds(List<Integer> customerIds);
}
