package com.substring.chat.entities;

import lombok.Data;

@Data
public class WhiteboardEvent {

    private String roomId;
    private String user;

    private double x0;
    private double y0;
    private double x1;
    private double y1;

    private String color;
    private double strokeWidth;

    private String type; // DRAW, CLEAR (for later)
}

