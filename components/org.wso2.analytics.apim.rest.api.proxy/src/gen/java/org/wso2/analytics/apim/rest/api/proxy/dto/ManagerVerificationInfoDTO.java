package org.wso2.analytics.apim.rest.api.proxy.dto;


import com.google.gson.annotations.SerializedName;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.Objects;

/**
 * ManagerVerificationInfoDTO
 */
public class ManagerVerificationInfoDTO   {
  @SerializedName("username")
  private String username = null;

  @SerializedName("isManager")
  private Boolean isManager = null;

  public ManagerVerificationInfoDTO username(String username) {
    this.username = username;
    return this;
  }

   /**
   * Get username
   * @return username
  **/
  @ApiModelProperty(example = "admin@carbon.super", value = "")
  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public ManagerVerificationInfoDTO isManager(Boolean isManager) {
    this.isManager = isManager;
    return this;
  }

   /**
   * Get isManager
   * @return isManager
  **/
  @ApiModelProperty(example = "true", value = "")
  public Boolean getIsManager() {
    return isManager;
  }

  public void setIsManager(Boolean isManager) {
    this.isManager = isManager;
  }


  @Override
  public boolean equals(java.lang.Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ManagerVerificationInfoDTO managerVerificationInfo = (ManagerVerificationInfoDTO) o;
    return Objects.equals(this.username, managerVerificationInfo.username) &&
        Objects.equals(this.isManager, managerVerificationInfo.isManager);
  }

  @Override
  public int hashCode() {
    return Objects.hash(username, isManager);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ManagerVerificationInfoDTO {\n");
    
    sb.append("    username: ").append(toIndentedString(username)).append("\n");
    sb.append("    isManager: ").append(toIndentedString(isManager)).append("\n");
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

