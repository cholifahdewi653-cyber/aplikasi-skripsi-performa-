import { jest } from "@jest/globals";

export const uploadToCloudinary = jest.fn().mockImplementation(async () => {
  return { url: "http://example.com/dummy.jpg", id: "dummy-id" };
});

export const uploadMultipleToCloudinary = jest.fn().mockImplementation(async (buffers: any) => {
  return [{ url: "http://example.com/dummy.jpg", id: "dummy-id" }];
});

export const deleteFromCloudinary = jest.fn().mockImplementation(async () => {
  return undefined;
});

export const deleteManyFromCloudinary = jest.fn().mockImplementation(async () => {
  return undefined;
});
