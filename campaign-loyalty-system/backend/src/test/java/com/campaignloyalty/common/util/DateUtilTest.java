package com.campaignloyalty.common.util;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DateUtilTest {

    @Test
    void getStartOfDayReturnsMidnight() {
        assertEquals(LocalTime.MIDNIGHT, DateUtil.getStartOfDay().toLocalTime());
    }

    @Test
    void getEndOfDayReturnsLastMomentOfDay() {
        assertEquals(LocalTime.MAX, DateUtil.getEndOfDay().toLocalTime());
    }
}
