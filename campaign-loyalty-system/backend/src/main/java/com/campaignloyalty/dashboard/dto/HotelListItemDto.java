package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class HotelListItemDto {

    private Integer id;
    private String name;
    private String location;
    private LocalDateTime createdAt;
}
