
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f0f2f5;
  overflow-x: hidden; /* স্ক্রল issue এড়াতে */
}

/* 🔵 হেডার */
header {
  display: flex;
  align-items: center;
  background-color: #004080;
  color: white;
  padding: 10px;
}

header img {
  height: 50px;
  margin-right: 10px;
}

header h1 {
  font-size: 20px;
}

#menuIcon {
  font-size: 24px;
  cursor: pointer;
  margin-right: 10px;
}

/* 🔵 সাইডবার */
#sidebar {
  position: fixed;
  top: 0;
  left: -250px;
  width: 250px;
  height: 100%;
  background-color: #333;
  color: white;
  overflow-y: auto;
  transition: left 0.3s ease;
  z-index: 999;
}

#sidebar.active {
  left: 0;
}

#sidebar ul {
  list-style-type: none;
  padding: 0;
}

#sidebar li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #444;
  position: relative;
}

#sidebar li:hover {
  background-color: #444;
}

.arrow {
  float: right;
  transition: transform 0.3s ease;
}

/* 🔵 সাবমেনু */
.submenu, .subsubmenu {
  display: none;
  background-color: #555;
}

.submenu li, .subsubmenu li {
  padding-left: 20px;
}

.subsubmenu {
  background-color: #666;
}

/* 🔵 কন্টেন্ট এরিয়া */
#content {
  margin-left: 0;
  padding: 20px;
  transition: margin-left 0.3s ease;
}

/* 🔵 হেডিং কালার */
#content h2 {
  color: #004080;
}

/* 🔵 অ্যানিমেশন */
.animated {
  animation: flyIn 0.6s ease-out;
}

@keyframes flyIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0px);
    opacity: 1;
  }
}

/* 🔵 অ্যারো ঘুরে যাওয়া */
.rotate-down {
  transform: rotate(90deg);
}

@media screen and (min-width: 768px) {
  #content {
    margin-left: 0;
  }
}
