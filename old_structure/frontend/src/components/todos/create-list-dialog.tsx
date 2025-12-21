'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateList } from '@/lib/hooks/use-todos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const createListSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type CreateListFormValues = z.infer<typeof createListSchema>;

export function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const createListMutation = useCreateList();

  const form = useForm<CreateListFormValues>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: '',
      color: '#3B82F6',
      icon: 'list',
    },
  });

  function onSubmit(data: CreateListFormValues) {
    createListMutation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new todo list to organize your tasks
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Work Tasks, Personal, Shopping"
                      {...field}
                      disabled={createListMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="h-10 w-20"
                        {...field}
                        disabled={createListMutation.isPending}
                      />
                      <Input
                        type="text"
                        placeholder="#3B82F6"
                        {...field}
                        disabled={createListMutation.isPending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createListMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createListMutation.isPending}>
                {createListMutation.isPending ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
