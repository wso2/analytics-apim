# Anonymize the reference to a user name

## How to run

> gdpr-client \[options]>

## Options

##### Option U
User Name (mandatory)

example
>-U john

###### Option D
Configuration Directory (optional)

example
>-D /Users/john/wso2am-analytics-3.1.0/wso2/tools/gdpr-client/conf

##### Option T
Tenant Domain (optional) Default = “carbon.super”

example
>-T acme-company

##### Option E
User Email (optional)

example
>-E john.doe@wso2.com

##### Option I
User IP Address (optional)

example
>-I 127.0.0.1

##### Option sha256
To enable SHA256 hashing for anonymizing the given ID attribute (optional)
> -sha256

##### Option pu
The pseudonym which the user name needs to be
replaced with. (optional)  Default = A random UUID
value is generated

example
> -pu “123-343-435-545-dfd-4”
