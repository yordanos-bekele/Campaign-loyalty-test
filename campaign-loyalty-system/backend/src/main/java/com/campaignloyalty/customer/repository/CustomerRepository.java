package com.campaignloyalty.customer.repository;

import com.campaignloyalty.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Customer findByDeviceId(String deviceId);
}