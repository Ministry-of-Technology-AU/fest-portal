"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome to Security Portal</h2>
            <p className="text-muted-foreground mt-2">Manage gate-in, registration, and user information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/fest/gate-in">
              <Card className="cursor-pointer hover:shadow-lg transition h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Gate-In/Out</CardTitle>
                  <CardDescription>Check students in and out at the gate</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Manage gate entry and exit records</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/fest/registration">
              <Card className="cursor-pointer hover:shadow-lg transition h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Registration</CardTitle>
                  <CardDescription>Handle registration check-in and check-out</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Track student registration status</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/fest/user-management">
              <Card className="cursor-pointer hover:shadow-lg transition h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Manage Users</CardTitle>
                  <CardDescription>Update student information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Edit or replace user details</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/fest/fest-users">
              <Card className="cursor-pointer hover:shadow-lg transition h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Fest Users</CardTitle>
                  <CardDescription>Create and manage fest user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Add/remove portal login accounts</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/fest/admin">
              <Card className="cursor-pointer hover:shadow-lg transition h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Admin Dashboard</CardTitle>
                  <CardDescription>View all portal activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Monitor gate-in, registration, and status</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </main>
      </div>
  )
}
