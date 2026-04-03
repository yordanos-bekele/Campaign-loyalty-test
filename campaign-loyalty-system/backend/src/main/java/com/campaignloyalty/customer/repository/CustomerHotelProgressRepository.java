package com.campaignloyalty.customer.repository;

import com.campaignloyalty.customer.entity.CustomerHotelProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerHotelProgressRepository extends JpaRepository<CustomerHotelProgress, Long> {

    CustomerHotelProgress findByCustomerIdAndHotelId(Long customerId, Long hotelId);
}