package com.team.backend.api.controller.admin;

import com.team.backend.api.dto.click.DashboardClicksResponse;
import com.team.backend.service.click.DashboardClicksService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import static org.springframework.format.annotation.DateTimeFormat.ISO;

@RestController
@RequestMapping("/admin/dashboard")
public class DashboardClicksController {

  private final DashboardClicksService service;

  public DashboardClicksController(DashboardClicksService service) {
    this.service = service;
  }

  @GetMapping("/clicks")
  public DashboardClicksResponse getDashboardClicks(
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "10") int topN
  ) {
    return service.getDashboardClicks(from, to, topN);
  }
}