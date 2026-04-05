package com.campaignloyalty.customer.repository;

import com.campaignloyalty.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    Customer findByDeviceId(String deviceId);

    Customer findByPhoneNumber(String phoneNumber);

    Customer findByEmailIgnoreCase(String email);

    List<Customer> findAllByRegisteredAtIsNotNullOrderByRegisteredAtDesc();
}
