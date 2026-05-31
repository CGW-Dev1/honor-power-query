package com.example.honorpower.domain;

public enum GamePlatform {
    ANDROID("Android"),
    IOS("iOS");

    private final String label;

    GamePlatform(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
