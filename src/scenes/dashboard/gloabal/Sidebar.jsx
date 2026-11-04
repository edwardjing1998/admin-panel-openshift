import React from "react";
import { Sidebar as MySidebar, Menu, MenuItem } from "react-pro-sidebar";
// import "react-pro-sidebar/dist/css/styles.css";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import userImage from "../../../assets/images/user.png";
const Item = ({ title, to, icon, selected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === to}
      style={{
        color: colors.grey[100],
      }}
      icon={icon}
      component={<Link to={to} />}
    >
      <Typography>{title}</Typography>

      <Link to={to} />
    </MenuItem>
  );
};

function Sidebar() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const selected = `${location.pathname}${location.search}`;

  return (
    <div className="sidebar">
      <Box
        sx={{
          "& .pro-sidebar": {
            backgroundColor: "black !important",
          },
          "& .pro-sidebar-inner": {
            backgroundColor: `${colors.primary[400]} !important`,
          },
          "& .pro-icon-wrapper": {
            backgroundColor: "transparent !important",
          },
          "& .pro-inner-item": {
            // padding: "5px 35px 5px 20px !important",
          },
          "& .pro-inner-item:hover": {
            // color: `${colors.grey[700]} !important`,
          },
          "& .pro-menu-item.active": {
            color: "#6870fa !important",
          },
          "& .ps-menuitem-root:hover": {
            color: "yellow !important",
          },
        }}
      >
        <MySidebar
          // className="sidebar"
          collapsed={isCollapsed}
          backgroundColor={colors.primary[400]}
          height="100vh"
          // overflowY="scroll"
          // position="fixed"
        >
          <Menu
            iconShape="square"
            menuItemStyles={{
              button: {
                // the active class will be added automatically by react router
                // so we can use it to style the active menu item
                [`&:hover`]: {
                  backgroundColor: colors.blueAccent[300],
                  // color: "#b6c8d9",
                },
                [`&.active`]: {
                  backgroundColor: "#fff",
                  color: "#b6c8d9",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => setCollapsed(!isCollapsed)}
              icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
              style={{
                margin: "10px 0px 20px 0px",
                color: colors.grey[700],
              }}
            >
              {!isCollapsed && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  ml="15px"
                >
                  <Typography variant="h3" color={colors.grey[100]}>
                    AI LEARNING
                  </Typography>
                  <IconButton onClick={() => setCollapsed(!isCollapsed)}>
                    <MenuOutlinedIcon />
                  </IconButton>
                </Box>
              )}
            </MenuItem>
            {!isCollapsed && (
              <Box mb="25px">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <img
                    src={userImage}
                    alt="user-profile"
                    width="100px"
                    height="100px"
                    style={{
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  />
                </Box>
                <Box textAlign="center">
                  <Typography
                    variant="h3"
                    color={colors.grey[100]}
                    fontWeight="bold"
                    sx={{ m: "10px 0 0 0" }}
                  >
                    Sajid Bhatti
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="400"
                    color={colors.greenAccent[500]}
                  >
                    Admin
                  </Typography>
                </Box>
              </Box>
            )}
            <Box paddingLeft={isCollapsed ? undefined : "10%"}>
              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Learning Hub
              </Typography>
              <Item title="Learning Home" to="/" icon={<HomeOutlinedIcon />} selected={selected} />
              <Item title="Learning Calendar" to="/calendar" icon={<CalendarTodayOutlinedIcon />} selected={selected} />

              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Courses
              </Typography>
              <Item title="Mathematics" to="/maths" icon={<CalculateOutlinedIcon />} selected={selected} />

              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Portfolio
              </Typography>
              <Item title="Saved Exercises" to="/maths?tab=mywork" icon={<ReceiptOutlinedIcon />} selected={selected} />

              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Progress
              </Typography>
              <Item title="Maths Progress" to="/maths?tab=progress" icon={<BarChartOutlinedIcon />} selected={selected} />

              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Explore
              </Typography>
              <Item title="Explore Mathematics" to="/maths?tab=overview" icon={<MapOutlinedIcon />} selected={selected} />

              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Learning Support
              </Typography>
              <Item title="AI Learning Assistant" to="/learning-assistant" icon={<HelpOutlineOutlinedIcon />} selected={selected} />

              {/* Preserve original admin-template features until they are replaced by education APIs. */}
              <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0px 5px 20px" }}>
                Administration & Tools
              </Typography>
              <Item title="Manage Team" to="/team" icon={<PeopleOutlinedIcon />} selected={selected} />
              <Item title="Contacts Information" to="/contact" icon={<ContactsOutlinedIcon />} selected={selected} />
              <Item title="Invoices Balances" to="/invoices" icon={<ReceiptOutlinedIcon />} selected={selected} />
              <Item title="Profile Form" to="/form" icon={<PersonOutlinedIcon />} selected={selected} />
              <Item title="Bar Chart" to="/bar" icon={<BarChartOutlinedIcon />} selected={selected} />
              <Item title="Pie Chart" to="/pie" icon={<PieChartOutlineOutlinedIcon />} selected={selected} />
              <Item title="Line Chart" to="/line" icon={<TimelineOutlinedIcon />} selected={selected} />
              <Item title="Geography Chart" to="/geography" icon={<MapOutlinedIcon />} selected={selected} />
            </Box>
          </Menu>
        </MySidebar>
      </Box>
    </div>
  );
}

export default Sidebar;
