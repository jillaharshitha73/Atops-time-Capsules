"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, SortAsc } from "lucide-react"

interface CapsuleFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  onClearFilters: () => void
}

export function CapsuleFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: CapsuleFiltersProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search capsules..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-300 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full md:w-40 border-slate-300 text-slate-900 dark:text-slate-100">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="unlocked">Unlocked</SelectItem>
            <SelectItem value="ready">Ready to Open</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full md:w-48 border-slate-300 text-slate-900 dark:text-slate-100">
            <SortAsc className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created-desc">Newest First</SelectItem>
            <SelectItem value="created-asc">Oldest First</SelectItem>
            <SelectItem value="unlock-asc">Unlock Date (Soon)</SelectItem>
            <SelectItem value="unlock-desc">Unlock Date (Later)</SelectItem>
            <SelectItem value="title-asc">Title A-Z</SelectItem>
            <SelectItem value="title-desc">Title Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="border-slate-300 bg-transparent text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
