package org.wso2.analytics.apim.rest.api.config.dto;


import com.google.gson.annotations.SerializedName;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.Objects;

/**
 * ServerUrlListDTO
 */
public class ServerUrlListDTO   {
  @SerializedName("storeUrl")
  private String storeUrl = null;

  @SerializedName("publisherUrl")
  private String publisherUrl = null;

  public ServerUrlListDTO storeUrl(String storeUrl) {
    this.storeUrl = storeUrl;
    return this;
  }

   /**
   * Get storeUrl
   * @return storeUrl
  **/
  @ApiModelProperty(value = "")
  public String getStoreUrl() {
    return storeUrl;
  }

  public void setStoreUrl(String storeUrl) {
    this.storeUrl = storeUrl;
  }

  public ServerUrlListDTO publisherUrl(String publisherUrl) {
    this.publisherUrl = publisherUrl;
    return this;
  }

   /**
   * Get publisherUrl
   * @return publisherUrl
  **/
  @ApiModelProperty(value = "")
  public String getPublisherUrl() {
    return publisherUrl;
  }

  public void setPublisherUrl(String publisherUrl) {
    this.publisherUrl = publisherUrl;
  }


  @Override
  public boolean equals(java.lang.Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ServerUrlListDTO serverUrlList = (ServerUrlListDTO) o;
    return Objects.equals(this.storeUrl, serverUrlList.storeUrl) &&
        Objects.equals(this.publisherUrl, serverUrlList.publisherUrl);
  }

  @Override
  public int hashCode() {
    return Objects.hash(storeUrl, publisherUrl);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ServerUrlListDTO {\n");
    
    sb.append("    storeUrl: ").append(toIndentedString(storeUrl)).append("\n");
    sb.append("    publisherUrl: ").append(toIndentedString(publisherUrl)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(java.lang.Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}

