package com.campaignloyalty.scan.dto;

public class ScanResponse {

    private boolean success;
    private String message;
    private boolean rewardEarned;

    public ScanResponse(boolean success, String message, boolean rewardEarned) {
        this.success = success;
        this.message = message;
        this.rewardEarned = rewardEarned;
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRewardEarned() {
        return rewardEarned;
    }
}