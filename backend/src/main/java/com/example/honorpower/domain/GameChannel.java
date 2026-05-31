package com.example.honorpower.domain;

public enum GameChannel {
    WECHAT("微信区"),
    QQ("QQ区");

    private final String label;

    GameChannel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
