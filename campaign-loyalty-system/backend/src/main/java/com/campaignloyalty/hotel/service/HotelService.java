package com.campaignloyalty.hotel.service;

import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;

    public Hotel findById(Integer id) {
        return hotelRepository.findById(id).orElse(null);
    }

    public Hotel create(Hotel hotel) {
        if (hotelRepository.findByNameIgnoreCase(hotel.getName()) != null) {
            throw new IllegalArgumentException("Hotel name already exists");
        }
        return hotelRepository.save(hotel);
    }

    public Hotel authenticate(String name, String password) {
        Hotel hotel = hotelRepository.findByNameIgnoreCase(name);
        if (hotel == null || !hotel.getPassword().equals(password)) {
            throw new IllegalArgumentException("Invalid hotel name or password");
        }
        return hotel;
    }

    public List<Hotel> findAll() {
        return hotelRepository.findAll();
    }
}
