package com.campaignloyalty.hotel.service;

import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;

    public Hotel findById(Long id) {
        return hotelRepository.findById(id).orElse(null);
    }
}
