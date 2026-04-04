package com.campaignloyalty.hotel.repository;

import com.campaignloyalty.hotel.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HotelRepository extends JpaRepository<Hotel, Integer> {

    Hotel findByNameIgnoreCase(String name);
}
