package org.wso2.analytics.apim.idp.client.dto;

import com.google.gson.annotations.SerializedName;

/**
 *  DTO for devportal custom URL, the same URL is used for analytics as well.
 */
public class CustomUrlInfoDevPortalDTO {
  @SerializedName("url")
  private String url = null;

  public String getUrl() {
    return url;
  }
  public void setUrl(String url) {
    this.url = url;
  }


  @Override
  public String toString()  {
    StringBuilder sb = new StringBuilder();
    sb.append("class CustomUrlInfoDevPortalDTO {\n");
    
    sb.append("  url: ").append(url).append("\n");
    sb.append("}\n");
    return sb.toString();
  }
}
