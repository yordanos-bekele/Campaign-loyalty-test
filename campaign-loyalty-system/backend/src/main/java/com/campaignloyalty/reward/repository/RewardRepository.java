package com.campaignloyalty.reward.repository;

import com.campaignloyalty.dashboard.dto.CustomerMetricCountDto;
import com.campaignloyalty.reward.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Integer> {

    long countByHotelIdAndEarnedAtBetween(Integer hotelId, LocalDateTime start, LocalDateTime end);

    long countByEarnedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
            select new com.campaignloyalty.dashboard.dto.CustomerMetricCountDto(
                r.customerId,
                count(r.id)
            )
            from Reward r
            where r.customerId in :customerIds
            group by r.customerId
            """)
    List<CustomerMetricCountDto> countRewardsByCustomerIds(List<Integer> customerIds);
}
