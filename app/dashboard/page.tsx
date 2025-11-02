"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome to Security Portal</h2>
            <p className="text-muted-foreground mt-2">Manage gate-in, registration, and user information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/gate-in">
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

            <Link href="/registration">
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

            <Link href="/user-management">
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

            <Link href="/admin">
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
    </AuthGuard>
  )
}
