import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { hideNav, showNav } from "../feature/Page/hideNavbar";
import LoadingBar from "react-top-loading-bar";
import NotificationsSystem, {
  atalhoTheme,
  dismissNotification,
  notify,
  setUpNotifications,
} from "reapop";
import { setProgress } from "../feature/Page/loading";
import { GraphQLClient, gql } from "graphql-request";
import { login, logout } from "../feature/Auth/user";
import { setCartItems } from "../feature/Cart/cart";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const progress = useSelector((state) => state.loading.progress);
  const hideNavbar = useSelector((state) => state.hideNavbar.value);
  const notifications = useSelector((state) => state.notifications);
  const User = useSelector((state) => state.auth.data);
  setUpNotifications({
    defaultProps: {
      position: "bottom-left",
      dismissible: true,
      dismissAfter: 3000,
      showDismissButton: true,
    },
  });
  useEffect(() => {
    if (
      location.pathname === "/auth/signin" ||
      location.pathname === "/auth/signup"
    ) {
      dispatch(hideNav());
    } else {
      dispatch(showNav());
    }
  }, [location.pathname]);
  useEffect(() => {
    const Signin = async () => {
      dispatch(setProgress(20));
      const graphQLClient = new GraphQLClient(
        import.meta.env.VITE_HYGRAPH_ENDPOINT,
        {
          headers: {
            authorization: `Bearer ${import.meta.env.VITE_HYGRAPH_TOKEN}`,
          },
        }
      );
      const query = gql`
        query Myquery {
          customer(where: { email: "${User.email}" }) {
            id
            name
            password
            phoneNumber
            email
            cart {
              id
              orderItems {
                product {
                  images {
                    url
                  }
                  id
                  name
                  price
                }
                id
                quantity
                total
              }
            }
          }
        }
      `;

      // Calling the mutation
      const Newdata = await graphQLClient.request(query);
      dispatch(setProgress(40));

      if (Newdata.customer === null) {
        dispatch(setProgress(60));
        dispatch(
          notify({
            title: "Invalid Credentials",
            message: `No user with this Email`,
            status: "error",
          })
        );
        dispatch(setProgress(100));
        return;
      }
      

      
      if (Newdata.customer.password === User.password){
        dispatch(setProgress(60));
        dispatch(login(Newdata.customer));
        dispatch(
          notify({
            title: "Signin Successfull",
            message: `Welcome ${Newdata.customer.name}`,
            status: "success",
          })
        );
        dispatch(setProgress(80));
        if (Newdata.customer.cart !== null) {
          dispatch(setCartItems(Newdata.customer.cart));
        }
      } else {
        dispatch(
          notify({
            title: "Invalid Credentials",
            message: "Bad password",
            status: "warning",
          })
        );
        dispatch(logout());
      }
      dispatch(setProgress(100));
    };
    if (User.email !== null) Signin();
  }, []);

  return (
    <>
      <NotificationsSystem
        smallScreenBreakpoint={768}
        notifications={notifications}
        dismissNotification={(id) => dispatch(dismissNotification(id))}
        theme={atalhoTheme}
      />

      <LoadingBar
        color="#ffffff"
        progress={progress}
        shadow={true}
        height={4}
        transitionTime={750}
        loaderSpeed={900}
        waitingTime={700}
        onLoaderFinished={() => dispatch(setProgress(0))}
      />
      {
        <div className=" mx-auto space-y-2 h-screen overflow-x-hidden">
          {!hideNavbar && <Navbar />}
          <Outlet />
          {/* <Footer /> */}
        </div>
      }
    </>
  );
}
