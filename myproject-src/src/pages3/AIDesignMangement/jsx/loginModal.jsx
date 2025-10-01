import React, { useState } from "react";
import { Modal, Form, Input, Button } from "antd";

function View(props) {
  const {
    loginModalVisible,
    setLoginVisibleModal,
    manageLoginOpt
  } = props
  return (
    <Modal
      width={550}
      footer={true}
      title="Ai渲染后台管理"
      visible={loginModalVisible}
      maskClosable={false}
      centered={true}
      destroyOnClose={true}
      onCancel={() => setLoginVisibleModal(false)}
    >
      <div className="mange-login-modal">
        <Form
          labelCol={{
            span: 5,
          }}
          wrapperCol={{
            span: 19,
          }}
          autoComplete="off"
          onFinish={(val) => manageLoginOpt(val)}
        >
          <Form.Item
            label="管理员账号"
            name="accountNo"
            rules={[
              {
                required: true,
                message: '请输入管理员账号',
              },
            ]}
          >
            <Input placeholder="请输入"/>
          </Form.Item>
          <Form.Item
            label="管理员密码"
            name="password"
            rules={[
              {
                required: true,
                message: '请输入管理员密码',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              offset: 10,
              span: 14,
            }}
          >
            <Button type="primary" htmlType="submit">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
export default View
