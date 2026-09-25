// errorConfig.ts
const ErrorMenu: Record<number, {
  status: number;
  title: string;
  text: string;
  error_image?: string;
  btn_text: string;
  btn_navigate: string;
}> = {
  0: {
    status: 0,
    title: 'NO INTERNET',
    text: 'Please check your connection',
    error_image: '/icons/NoInternet.svg',
    btn_text: 'Retry',
    btn_navigate: '/dashboard',
  },
  401: {
    status: 401,
    title: 'UNAUTHORIZED',
    text: 'You need to login first',
    error_image: '/icons/401-ErrorUnauthorized.svg',
    btn_text: 'Login',
    btn_navigate: '/',
  },
  403: {
    status: 403,
    title: 'FORBIDDEN',
    text: 'You do not have permission',
    error_image: '/icons/403-ErrorForbidden.svg',
    btn_text: 'Home',
    btn_navigate: '/dashboard',
  },
  404: {
    status: 404,
    title: 'PAGE NOT FOUND',
    text: 'The page you are looking for does not exist',
    error_image: '/icons/PageNotFound.svg',
    btn_text: 'Home',
    btn_navigate: '/dashboard',
  },
  500: {
    status: 500,
    title: 'SERVER ERROR',
    text: 'Something went wrong on our side',
    error_image: '/icons/500-InternalServerError.svg',
    btn_text: 'Retry',
    btn_navigate: '/dashboard',
  },
  503: {
    status: 503,
    title: 'SERVICE UNAVAILABLE',
    text: 'Something went wrong on our side',
    error_image: '/icons/503-ServiceUnavailable.svg',
    btn_text: 'Retry',
    btn_navigate: '/dashboard',
  },
};

export default ErrorMenu;
