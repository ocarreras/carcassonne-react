/**
 * Static navbar copied from:
 *
 * https://dev.to/devggaurav/let-s-build-a-responsive-navbar-and-hamburger-menu-using-html-css-and-javascript-4gci
 *
 * TODO:
 * - Add submenus
 * - Dinamic menus with component props
 * - Test with tablets / mobile phones.
 * - ... Links actually doing something.
 */
import { useState } from "react";
import "../NavBar.css";

const NavBar = () => {
  const [mobileMenuActive, setMobileMenuActive] = useState(false);

  return (
    <>
      <header className="navHeader">
        <nav className="navBar">
          <a href="#" className="navLogo">
            HereLogo
          </a>
          <ul className={"navMenu" + (mobileMenuActive ? " active" : "")}>
            <li className="navItem">
              <a className="navLink" href="/">
                Home
              </a>
            </li>
            <li className="navItem">
              <a className="navLink" href="/">
                Games
              </a>
            </li>
            <li className="navItem">
              <a className="navLink" href="/">
                Options
              </a>
            </li>
            <li className="navItem">
              <a className="navLink" href="/">
                Profile
              </a>
            </li>
          </ul>
          <div
            onClick={() => {
              setMobileMenuActive(!mobileMenuActive);
            }}
            className={"navHamburger" + (mobileMenuActive ? " active" : "")}
          >
            <span className="hamburgerBar"></span>
            <span className="hamburgerBar"></span>
            <span className="hamburgerBar"></span>
          </div>
        </nav>
      </header>
    </>
  );
};

export default NavBar;
