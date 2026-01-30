// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import {
//   Form,
//   Input,
//   Button,
//   Card,
//   Typography,
//   Select,
//   message,
//   Spin,
// } from "antd";
// import { API_BASE_URL } from "../../../../config";
// import axios from "axios";

// const { Title } = Typography;

// const AddUsers = () => {
//   const [form] = Form.useForm();
//   const user = useSelector((state) => state.user.value);

//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchingDepartments, setFetchingDepartments] = useState(true);
//   const [selectedRole, setSelectedRole] = useState(undefined); // NEW: Track selected role

//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   const fetchDepartmentData = async () => {
//     setFetchingDepartments(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}department/all`, config);
//       setDepartments(res.data.items || []);
//     } catch (err) {
//       message.error("Failed to fetch departments");
//     } finally {
//       setFetchingDepartments(false);
//     }
//   };

//   useEffect(() => {
//     fetchDepartmentData();
//     // eslint-disable-next-line
//   }, []);

//   const onFinish = async (values) => {
//     setLoading(true);
//     try {
//       const payload = {
//         first_name: values.first_name,
//         last_name: values.last_name,
//         email_data: {
//           email_id: values.email,
//         },
//         password: values.password,
//         phone_data: {
//           phone_number: values.mobile,
//         },
//         role: values.role,
//         designation: values.designation,
//         department: values.department_id, // only passed if exists
//       };

//       const res = await axios.post(`${API_BASE_URL}user`, payload, config);
//       if (res.status === 200 || res.status === 201) {
//         message.success("User added successfully ✅");
//         form.resetFields();
//         setSelectedRole(undefined); // reset the role selection
//       }
//     } catch (error) {
//       console.error(error);
//       message.error("Failed to add user ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetchingDepartments) {
//     return (
//       <Card
//         style={{
//           maxWidth: 500,
//           margin: "30px auto",
//           padding: "40px",
//           textAlign: "center",
//         }}
//       >
//         <Spin size="large" />
//       </Card>
//     );
//   }

//   return (
//     <Card style={{ maxWidth: 550, margin: "30px auto", padding: "20px" }}>
//       <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
//         Add User
//       </Title>
//       <Form form={form} layout="vertical" onFinish={onFinish}>
//         <Form.Item
//           label="First Name"
//           name="first_name"
//           rules={[{ required: true, message: "Please enter first name" }]}
//         >
//           <Input placeholder="Enter first name" />
//         </Form.Item>
//         <Form.Item
//           label="Last Name"
//           name="last_name"
//           rules={[{ required: true, message: "Please enter last name" }]}
//         >
//           <Input placeholder="Enter last name" />
//         </Form.Item>
//         <Form.Item
//           label="Role"
//           name="role"
//           rules={[{ required: true, message: "Please select a role" }]}
//         >
//           <Select
//             placeholder="Select role"
//             onChange={(value) => setSelectedRole(value)}
//             allowClear
//           >
//             <Select.Option value="OWNER">OWNER</Select.Option>
//             <Select.Option value="APPROVER">APPROVER</Select.Option>
//             <Select.Option value="DEPARTMENT">DEPARTMENT</Select.Option>
//             <Select.Option value="CA">CA</Select.Option>
//           </Select>
//         </Form.Item>
//         <Form.Item
//           label="Designation"
//           name="designation"
//           rules={[{ required: true, message: "Please enter designation" }]}
//         >
//           <Input placeholder="Enter designation" />
//         </Form.Item>

//         {/* Conditionally render the department dropdown */}
//         {selectedRole === "DEPARTMENT" && (
//           <Form.Item
//             label="Department"
//             name="department_id"
//             rules={[{ required: true, message: "Please select department(s)" }]}
//           >
//             <Select placeholder="Select department" mode="multiple" allowClear>
//               {departments.map((dep) => (
//                 <Select.Option key={dep.id} value={dep.id}>
//                   {dep.name}
//                 </Select.Option>
//               ))}
//             </Select>
//           </Form.Item>
//         )}

//         <Form.Item
//           label="Email"
//           name="email"
//           rules={[
//             { required: true, message: "Please enter email" },
//             { type: "email", message: "Please enter a valid email" },
//           ]}
//         >
//           <Input placeholder="Enter email" />
//         </Form.Item>
//         <Form.Item
//           label="Password"
//           name="password"
//           rules={[{ required: true, message: "Please enter password" }]}
//         >
//           <Input.Password placeholder="Enter password" />
//         </Form.Item>
//         <Form.Item
//           label="Mobile"
//           name="mobile"
//           rules={[{ required: true, message: "Please enter mobile number" }]}
//         >
//           <Input placeholder="Enter mobile number" maxLength={15} />
//         </Form.Item>
//         <Form.Item>
//           <Button type="primary" htmlType="submit" block loading={loading}>
//             Submit
//           </Button>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// export default AddUsers;
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  message,
  Spin,
} from "antd";
import { API_BASE_URL } from "../../../../config";
import axios from "axios";

const { Title } = Typography;

const AddUsers = () => {
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user.value);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const [selectedRole, setSelectedRole] = useState(undefined);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchDepartmentData = async () => {
    setFetchingDepartments(true);
    try {
      const res = await axios.get(`${API_BASE_URL}department/all`, config);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch departments");
    } finally {
      setFetchingDepartments(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
    // eslint-disable-next-line
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email_data: { email_id: values.email },
        password: values.password,
        phone_data: { phone_number: values.mobile },
        role: values.role,
        designation: values.designation,
        department: values.department_id, // send department id(s)
      };

      const res = await axios.post(`${API_BASE_URL}user`, payload, config);
      if (res.status === 200 || res.status === 201) {
        message.success("User added successfully ✅");
        form.resetFields();
        setSelectedRole(undefined);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to add user ❌");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDepartments) {
    return (
      <Card
        style={{
          maxWidth: 500,
          margin: "30px auto",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 550, margin: "30px auto", padding: "20px" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
        Add User
      </Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="First Name"
          name="first_name"
          rules={[{ required: true, message: "Please enter first name" }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="last_name"
          rules={[{ required: true, message: "Please enter last name" }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select
            placeholder="Select role"
            onChange={(value) => setSelectedRole(value)}
            allowClear
          >
            <Select.Option value="OWNER">OWNER</Select.Option>
            <Select.Option value="APPROVER">APPROVER</Select.Option>
            <Select.Option value="DEPARTMENT">DEPARTMENT</Select.Option>
            <Select.Option value="CA">CA</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Designation"
          name="designation"
          rules={[{ required: true, message: "Please enter designation" }]}
        >
          <Input placeholder="Enter designation" />
        </Form.Item>

        {selectedRole === "DEPARTMENT" && (
          <Form.Item
            label="Department"
            name="department_id"
            rules={[{ required: true, message: "Please select department(s)" }]}
          >
            <Select placeholder="Select department" mode="multiple" allowClear>
              {departments.map((dep) => (
                <Select.Option key={dep.id} value={dep.id}>
                  {dep.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter password" }]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>

        <Form.Item
          label="Mobile"
          name="mobile"
          rules={[{ required: true, message: "Please enter mobile number" }]}
        >
          <Input placeholder="Enter mobile number" maxLength={15} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddUsers;
