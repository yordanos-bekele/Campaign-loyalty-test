package com.campaignloyalty.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DateUtil {

    public static LocalDateTime getStartOfDay() {
        return LocalDate.now().atStartOfDay();
    }

    public static LocalDateTime getEndOfDay() {
        return LocalDate.now().atTime(23, 59, 59);
    }
}