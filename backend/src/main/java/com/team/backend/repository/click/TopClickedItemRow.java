package com.team.backend.repository.click;

public interface TopClickedItemRow {
  long getItemId();
  String getItemName();   // 조인 없으면 제거
  String getCategory();   // 조인 없으면 제거
  long getClicks();
}
