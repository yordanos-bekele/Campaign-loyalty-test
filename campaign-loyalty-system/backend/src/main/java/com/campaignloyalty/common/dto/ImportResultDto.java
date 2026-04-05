package com.campaignloyalty.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ImportResultDto {

    private int processedCount;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    private List<String> errors;
}
