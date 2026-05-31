package com.example.honorpower.domain;

public enum RegionLevel {
    DISTRICT("县标", 1),
    CITY("市标", 2),
    PROVINCE("省标", 3),
    NATIONAL_TOP100("小国标", 4),
    NATIONAL_TOP10("大国标", 5);

    private final String label;
    private final int order;

    RegionLevel(String label, int order) {
        this.label = label;
        this.order = order;
    }

    public String getLabel() {
        return label;
    }

    public int getOrder() {
        return order;
    }
}
