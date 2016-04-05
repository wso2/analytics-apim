package org.wso2.analytics.apim.integration.common.utils;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class SiddhiSimulatorUtil {

    public static String readFile(String path) throws IOException {
        BufferedReader br = null;
        try {
            br = new BufferedReader(new FileReader(path));
            StringBuilder sb = new StringBuilder();
            String line = br.readLine();

            while (line != null) {
                sb.append(line + "\n");
                line = br.readLine();
            }
            return sb.toString();
        } finally {
            br.close();
        }
    }
}
