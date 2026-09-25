import { useNavigate } from "react-router-dom";
import { api } from "./Api"; 

export const useApi = () => {
  const navigate = useNavigate();

  const executeApi = async (config: any) => {
    try {
      const res = await api(config);

      if (res.status === 200) {
        return res.data;
      }

      return res.data;

    } catch (err: any) {

      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 ) {
        return data;
      }

      switch (status) {
        case 0:
          navigate("/error/0");
          break;
        case 401:
          navigate("/error/401");
          break;
        case 403:
          navigate("/error/403");
          break;
        case 404:
          navigate("/error/404");
          break;
        case 500:
          navigate("/error/500");
          break;
        case 503:
          navigate("/error/503");
          break;
        default:
          navigate("/error/unknown",{
            state: {
              text: data?.text || "Something Went Wrong",
              type: data?.type || "error"
            }
          }); // 👈 handle all other errors
      }

      throw err;
    }
  };

  return { executeApi };
};