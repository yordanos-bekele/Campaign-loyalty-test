package com.campaignloyalty.customer.repository;

import com.campaignloyalty.customer.entity.CustomerHotelProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerHotelProgressRepository extends JpaRepository<CustomerHotelProgress, Integer> {

    CustomerHotelProgress findByCustomerIdAndHotelId(Integer customerId, Integer hotelId);
}
