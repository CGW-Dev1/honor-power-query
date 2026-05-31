package com.example.honorpower.dto;

import java.util.List;

public record OptionResponse(
        List<OptionItem> platforms,
        List<OptionItem> channels,
        List<OptionItem> providers
) {
    public record OptionItem(String value, String label) {
    }
}
