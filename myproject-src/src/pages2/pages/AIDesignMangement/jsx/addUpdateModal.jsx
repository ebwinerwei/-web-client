import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, DatePicker, Select, message } from "antd";
import { getAccountDetail } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';

function View(props) {
  const {
    addUpdateModalVisible,
    setAddUpdateModalVisible,
    addUpdateOpt,
    updateInfo
  } = props
  const [form] = Form.useForm();

  useEffect(() => {
    if (updateInfo.accountId) {
      getAccountDetail(updateInfo).then(res => {
        if (res?.error?.errorCode == 0) {
          const date = dayjs(new Date(res.data.vipValidTime)).format('YYYY-MM-DD')
          form.setFieldsValue({
            ...res.data,
            vipValidTime: dayjs(date, 'YYYY-MM-DD')
          })
        } else {
          message.error(res?.error?.errorMsg || '查询失败')
        }
      })
    }
  }, [updateInfo.accountId])

  return (
    <Modal
      width={550}
      title={updateInfo.accountId ? '修改账号' : '新建账号'}
      visible={addUpdateModalVisible}
      maskClosable={false}
      centered={true}
      destroyOnClose={true}
      onCancel={() => setAddUpdateModalVisible(false)}
      onOk={() => {
        form.validateFields().then(res => {
          addUpdateOpt({
            ...res,
            vipValidTime: new Date(res.vipValidTime).getTime()
          })
        })
      }}
    >
      <Form
        form={form}
        labelCol={{
          span: 5,
        }}
        wrapperCol={{
          span: 19,
        }}
        autoComplete="off"
      >
        <Form.Item
          label="账户名称"
          name="accountNo"
          rules={[
            {
              required: true,
              message: '请输入账户名称',
            },
          ]}
        >
          <Input placeholder="请输入" style={{ width: 350 }}/>
        </Form.Item>
        <Form.Item
          label="账户密码"
          name="password"
          rules={[
            {
              required: true,
              message: '请输入账户密码',
            },
          ]}
        >
          <Input.Password style={{ width: 350 }} />
        </Form.Item>
        <Form.Item
          label="公司名称"
          name="remark"
        >
          <Input placeholder="请输入" style={{ width: 350 }}/>
        </Form.Item>
        <Form.Item
          label="账户有效期"
          name="vipValidTime"
          rules={[
            {
              required: true,
              message: '请选择账户有效期',
            },
          ]}
        >
          <DatePicker placeholder="请选择" style={{ width: 350 }}/>
        </Form.Item>
        <Form.Item
          label="账户类型"
          name="channelNo"
          rules={[
            {
              required: true,
              message: '请选择账户类型',
            },
          ]}
        >
          <Select
            style={{ width: 350 }}
            placeholder="请选择"
          >
            {[{ id: 'client', name: '客户端' }, { id: 'web', name: '网页端' }].map((v) => {
              return (
                <Select.Option key={v.id} value={v.id}>
                  {v.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
export default View
