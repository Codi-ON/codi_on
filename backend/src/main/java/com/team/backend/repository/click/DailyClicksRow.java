package com.team.backend.repository.click;

import java.time.LocalDate;

public interface DailyClicksRow {
  LocalDate getDate();
  long getClicks();
}