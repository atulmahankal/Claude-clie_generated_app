import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

/**
 * gRPC Client Factory
 *
 * Creates gRPC clients for connecting to microservices
 */

const PROTO_PATH = path.join(process.cwd(), '..', 'packages/grpc-protos/src');

// Service URLs from environment
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'localhost:50051';
const TODOS_SERVICE_URL = process.env.TODOS_SERVICE_URL || 'localhost:50052';
const FUNDFLOW_SERVICE_URL = process.env.FUNDFLOW_SERVICE_URL || 'localhost:50053';

/**
 * Load proto file and create client
 */
function createClient(protoFile: string, packageName: string, serviceName: string, serviceUrl: string) {
  const packageDefinition = protoLoader.loadSync(
    path.join(PROTO_PATH, protoFile),
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    }
  );

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const servicePackage = protoDescriptor[packageName];
  const ServiceClient = servicePackage[serviceName];

  return new ServiceClient(
    serviceUrl,
    grpc.credentials.createInsecure()
  );
}

// Create singleton clients
let authClient: any = null;
let todosClient: any = null;
let fundflowClient: any = null;

/**
 * Get Auth Service client
 */
export function getAuthClient() {
  if (!authClient) {
    authClient = createClient('auth.proto', 'auth', 'AuthService', AUTH_SERVICE_URL);
  }
  return authClient;
}

/**
 * Get Todos Service client
 */
export function getTodosClient() {
  if (!todosClient) {
    todosClient = createClient('todos.proto', 'todos', 'TodosService', TODOS_SERVICE_URL);
  }
  return todosClient;
}

/**
 * Get Fundflow Service client
 */
export function getFundflowClient() {
  if (!fundflowClient) {
    fundflowClient = createClient('fundflow.proto', 'fundflow', 'FundflowService', FUNDFLOW_SERVICE_URL);
  }
  return fundflowClient;
}

/**
 * Helper to promisify gRPC calls
 */
export function promisifyGrpcCall<T>(
  client: any,
  method: string,
  request: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    client[method](request, (error: any, response: T) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Close all clients
 */
export function closeAllClients() {
  if (authClient) {
    authClient.close();
    authClient = null;
  }
  if (todosClient) {
    todosClient.close();
    todosClient = null;
  }
  if (fundflowClient) {
    fundflowClient.close();
    fundflowClient = null;
  }
}
