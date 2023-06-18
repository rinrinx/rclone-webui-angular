import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { v4 as uuid } from 'uuid';

import { Err, Ok } from 'src/app/shared/result';
import { environment } from 'src/environments/environment';

interface Credentials {
  username: string;
  password: string;
}

export type NotSaved = undefined;
export const NotSaved: NotSaved = undefined;
export type NoAuthentication = null;
export const NoAuthentication: NoAuthentication = null;

export interface Connection {
  id: string;
  displayName: string;
  remoteAddress: string;
  isSameOrigin: boolean;
  authentication: string | NotSaved | NoAuthentication;
}

export interface ConnectionWithAuthentication extends Connection {
  authentication: string | NoAuthentication;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private connections$ = new BehaviorSubject<Connection[]>([]);
  private activeConnection: ConnectionWithAuthentication | null = null;

  constructor() {
    const connectionsJson = localStorage.getItem('rwa_authentication');
    if (!connectionsJson) {
      //first time user
      if (environment.embed) {
        this.connections$.next([
          {
            id: 'embed',
            displayName: 'This PC',
            remoteAddress: window.location.origin,
            isSameOrigin: true,
            authentication: NoAuthentication,
          },
        ]);
      }
      return;
    }
    const connections: Connection[] = JSON.parse(connectionsJson);
    this.connections$.next(connections);
  }

  saveConnection(
    connection: { displayName: string; remoteAddress: string },
    credentials: Credentials | NoAuthentication | NotSaved = NotSaved
  ) {
    const { displayName, remoteAddress } = connection;

    if (this.checkNameExists(displayName)) {
      return Err($localize`Name already exists`);
    }

    const authentication = credentials
      ? btoa(credentials.username + ':' + credentials.password)
      : credentials;

    const newConnection: Connection = {
      id: uuid(),
      displayName,
      remoteAddress,
      isSameOrigin: remoteAddress === window.location.origin,
      authentication,
    };

    const connections = this.connections$.getValue();
    connections.push(newConnection);
    this.connections$.next(connections);
    localStorage.setItem('rwa_authentication', JSON.stringify(connections));

    return Ok(newConnection);
  }

  getConnection(id: string) {
    return this.connections$.getValue().find((c) => c.id === id) ?? null;
  }

  updateConnection(
    id: string,
    connection: Partial<Omit<Connection, 'id' | 'authentication'>>,
    credentials: Credentials | NoAuthentication | NotSaved = NotSaved
  ) {
    const connections = this.connections$.getValue();
    const index = connections.findIndex((c) => c.id === id);
    if (index === -1) {
      return Err($localize`Connection ID not found`);
    }

    if (
      connection.displayName &&
      connection.displayName !== connections[index].displayName &&
      this.checkNameExists(connection.displayName)
    ) {
      return Err($localize`Name already exists`);
    }

    const updatedConnection = {
      ...connections[index],
      ...connection,
    };

    updatedConnection.authentication = credentials
      ? btoa(credentials.username + ':' + credentials.password)
      : credentials;

    connections[index] = updatedConnection;
    this.connections$.next(connections);
    localStorage.setItem('rwa_authentication', JSON.stringify(connections));

    return Ok();
  }

  activateConnection(id: string, credentials?: Credentials | NoAuthentication) {
    const connection = this.connections$.getValue().find((c) => c.id === id);
    if (!connection) {
      return Err($localize`Connection not found`);
    }

    const useConnection = { ...connection }; // shallow copy
    if (credentials === undefined) {
      if (useConnection.authentication === undefined) {
        return Err($localize`Connection has no authentication`);
      }
    } else {
      useConnection.authentication = credentials
        ? btoa(credentials.username + ':' + credentials.password)
        : NoAuthentication;
    }

    this.activeConnection = useConnection as ConnectionWithAuthentication;

    return Ok();
  }

  deleteConnection(id: string) {
    const connections = this.connections$.getValue();
    const index = connections.findIndex((c) => c.id === id);
    if (index === -1) {
      return Err($localize`Connection not found`);
    }

    connections.splice(index, 1);
    this.connections$.next(connections);
    localStorage.setItem('rwa_authentication', JSON.stringify(connections));

    return Ok();
  }

  getConnections(): Observable<Connection[]> {
    return this.connections$;
  }

  getConnectionsValue(): Connection[] {
    return this.connections$.getValue();
  }

  getActiveConnection() {
    return this.activeConnection;
  }

  checkNameExists(name: string): boolean {
    return this.connections$
      .getValue()
      .some((connection) => connection.displayName === name);
  }

  clear() {
    this.connections$.next([]);
    this.activeConnection = null;
    localStorage.removeItem('rwa_authentication');
  }
}
