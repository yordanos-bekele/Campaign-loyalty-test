package com.campaignloyalty.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class DateUtil {

    private DateUtil() {
    }

    public static LocalDateTime getStartOfDay() {
        return LocalDate.now().atStartOfDay();
    }

    public static LocalDateTime getEndOfDay() {
        return LocalDate.now().atTime(LocalTime.MAX);
    }
}
