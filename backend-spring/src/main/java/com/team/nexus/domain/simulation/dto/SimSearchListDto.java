package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SimSearchListDto {
    @JsonProperty("indust_cats")
    private List<SimIndustCatsDto> simIndustCatsDto;
    @JsonProperty("reg_codes")
    private List<SimRegCodesDto> simRegCodesDto;
}
